use {
    anchor_lang::prelude::*,
    anchor_spl::{
        token::{approve, Approve, Token, TokenAccount},
    },
};

pub fn approve_token(ctx: Context<ApproveToken>, amount: u64) -> Result<()> {

    if amount == 0 {
        return Err(ErrorCode::InvalidAmount.into());
    }

    if ctx.accounts.associated_token_account.amount < amount {
        return Err(ErrorCode::InsufficientFunds.into());
    }

    if ctx.accounts.delegate.key() == ctx.accounts.authority.key() {
        return Err(ErrorCode::DelegateIsSelf.into());
    }

    let cpi_accounts = Approve {
        to: ctx.accounts.associated_token_account.to_account_info(),
        delegate: ctx.accounts.delegate.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    // Create the CpiContext we need for the request
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    // Execute anchor's helper function to approve tokens
    approve(cpi_ctx, amount)?;
    Ok(())
} 


#[derive(Accounts)]
pub struct ApproveToken<'info> {
    ///CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub associated_token_account: Account<'info, TokenAccount>,
    ///CHECK: This is not dangerous because we don't read or write from this account
    pub delegate: AccountInfo<'info>,
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The authority is not authorized.")]
    Unauthorized,
    #[msg("Insufficient funds in the associated token account.")]
    InsufficientFunds,
    #[msg("The delegate cannot be the same as the authority.")]
    DelegateIsSelf,
    #[msg("Invalid amount.")]
    InvalidAmount,
}