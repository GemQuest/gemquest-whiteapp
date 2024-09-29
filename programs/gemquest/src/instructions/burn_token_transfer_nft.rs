use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, MintTo, Transfer, Burn, Mint, TokenAccount};
// use solana_program::program_option::COption;

pub fn initialize_burn_tracker(ctx: Context<InitializeBurnTracker>) -> Result<()> {
    let burn_tracker = &mut ctx.accounts.burn_tracker;
    burn_tracker.total_burned = 0;
    burn_tracker.nft_price = 0;
    Ok(())
}

pub fn burn_token_transfer_nft(ctx: Context<TransferToken>, amount: u64, value: u64) -> Result<()> {
    if amount == 0 {
        return Err(ErrorCode::InvalidPrice.into());
    }
    // TEST this new condition
    // if ctx.accounts.associated_token_account.delegate != COption::Some(ctx.accounts.from_authority.key())
    //     || ctx.accounts.associated_token_account.delegated_amount < amount
    // {
    //     return Err(ErrorCode::NotApproved.into());
    // }
   
    // Burn tokens before transferring the NFT
    let special_key = Pubkey::new_from_array([1; 32]);
    let burn_tracker = &mut ctx.accounts.burn_tracker;

    if ctx.accounts.to.key() == special_key {
        // Burn tokens
        let burn_cpi_accounts = Burn {
            mint: ctx.accounts.mint_token_account.to_account_info(),
            from: ctx.accounts.associated_token_account.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };
        let burn_cpi_program = ctx.accounts.token_program.to_account_info();
        let burn_cpi_ctx = CpiContext::new(burn_cpi_program, burn_cpi_accounts);
        token::burn(burn_cpi_ctx, amount)?;

        burn_tracker.total_burned += amount * value;
        msg!("Updated total burned: {}", burn_tracker.total_burned);
        msg!("Updated nft price: {}", burn_tracker.nft_price);
    } else {
        msg!("Burn tracker total burned: {}", burn_tracker.total_burned);
        burn_tracker.nft_price = amount;
        msg!("Burn tracker nft price: {}", burn_tracker.nft_price);
        
        if burn_tracker.total_burned < burn_tracker.nft_price {
            return Err(ErrorCode::IncorrectBurnAmount.into());
        }
        
        // Transfer NFT
        let transfer_instruction = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);

        anchor_spl::token::transfer(cpi_ctx, 1)?;

        // reset burnTracker
        burn_tracker.total_burned = 0;
        burn_tracker.nft_price = 0;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeBurnTracker<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 8 + 8, // discriminator + total_burned + nft_price
        seeds = [b"burn_tracker", payer.key().as_ref()],
        bump
    )]
    pub burn_tracker: Account<'info, BurnTracker>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferToken<'info> {
    #[account(mut)]
    pub associated_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub mint_token_account: Account<'info, Mint>,

    /// CHECK: The associated token account that we are transferring the token from
    #[account(mut)]
    pub from: UncheckedAccount<'info>,

    /// CHECK: The associated token account that we are transferring the token to
    /// This account can be optionally not provided by checking if it's default
    #[account(mut)]
    pub to: AccountInfo<'info>,

    pub from_authority: Signer<'info>,

    pub token_program: Program<'info, Token>,

    #[account(
        mut,
        seeds = [b"burn_tracker", from_authority.key().as_ref()],
        bump
    )]
    pub burn_tracker: Account<'info, BurnTracker>,
}

#[account]
pub struct BurnTracker {
    pub total_burned: u64,
    pub nft_price: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid input provided.")]
    InvalidInput,
    #[msg("Invalid price provided.")]
    InvalidPrice,
    #[msg("Insufficient balance.")]
    InsufficientBalance,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Invalid amount provided.")]
    InvalidAmount,
    #[msg("Overflow occurred.")]
    Overflow,
    #[msg("Incorrect burn amount for NFT transfer.")]
    IncorrectBurnAmount,
    // #[msg("Not approved.")]
    // NotApproved,
}
